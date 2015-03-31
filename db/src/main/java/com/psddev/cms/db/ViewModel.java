package com.psddev.cms.db;

import javax.servlet.ServletContext;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import com.psddev.dari.db.Recordable;
import com.psddev.dari.db.State;
import com.psddev.dari.util.ClassFinder;
import com.psddev.dari.util.StringUtils;
import com.psddev.dari.util.TypeDefinition;
import com.psddev.dari.util.WebPageContext;

public abstract class ViewModel<T extends Recordable> {

    private transient T model;
    private transient WebPageContext webPageContext;

    public T getModel() {
        return model;
    }

    public void setModel(T model) {
        this.model = model;
    }

    public WebPageContext getWebPageContext() {
        return webPageContext;
    }

    public void setWebPageContext(WebPageContext webPageContext) {
        this.webPageContext = webPageContext;
    }

    public static class Static {

        public static ViewModel<? extends Recordable> getInstance(HttpServletRequest request, HttpServletResponse response) {

            Object object = request.getAttribute("object");

            if (object == null || !(object instanceof Recordable)) {
                return null;
            }

            Recordable recordable = (Recordable) object;
            Renderer.TypeModification rendererData = State.getInstance(object).getType().as(Renderer.TypeModification.class);
            String context = request.getAttribute("context") != null ? request.getAttribute("context").toString() : null;

            if (rendererData == null) {
                return null;
            }

            String viewModelClassName = null;

            if (!StringUtils.isBlank(context)) {
                viewModelClassName = rendererData.getContextAndViewModelClasses().get(context);
            }

            if (StringUtils.isBlank(viewModelClassName)) {
                viewModelClassName = rendererData.getViewModelClassName();
            }

            ViewModel<Recordable> viewModel = null;

            for (Class<? extends ViewModel> foundViewModelClass : ClassFinder.Static.findClasses(ViewModel.class)) {
                if (foundViewModelClass.getCanonicalName().equals(viewModelClassName)) {
                    TypeDefinition typeDef = TypeDefinition.getInstance(foundViewModelClass);
                    viewModel = (ViewModel<Recordable>) typeDef.newInstance();
                }
            }

            if (viewModel == null) {
                return null;
            }

            viewModel.setModel(recordable);
            viewModel.setWebPageContext(new WebPageContext((ServletContext) null, request, response));
            return viewModel;
        }
    }

}
